'use strict';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const axios = require('axios');

module.exports.handler = (event, context, callback) => {
    const checks = JSON.parse(event.Records[0].Sns.Message);
    const validateStatus = () => true;

    const client = axios.create({
        baseURL: process.env.API_URL,
        timeout: 10000,
        validateStatus: validateStatus
    });

    client.interceptors.request.use((config) => {
        return Object.assign(config, {"start": Date.now()});
    });

    client.interceptors.response.use((response) => {
        return Object.assign(response, {"responseTime": Date.now() - response.config.start});
    }, (error) => {
        console.log(`Check error: ${JSON.stringify(error)}`);
        const status = (() => {
            switch (error.code) {
                case 'ENOTFOUND':
                    return 404;
                    break;
                case 'ECONNRESET':
                    return 504;
                    break;
                case 'ECONNABORTED':
                    return 504;
                    break;
                case 'HPE_INVALID_CONSTANT':
                    return 422;
                    break;
                default:
                    return 500
            }
        })();
        const result = Object.assign(error, {"status": status, "responseTime": Date.now() - error.config.start});
        return Promise.resolve(result);
    });

    const checkRequests = checks.map((check) => {
        console.log(`Probe check ${check.id} requesting ${check.protocol}://${check.url}`);
        return client.get(`${check.protocol}://${check.url}`, {
            "id": check.id,
            "previousStatus": check.status,
            "confirming": check.confirming
        });
    });

    axios.all(checkRequests)
        .then((results) => {
            const checkStatuses = results.map((result) => {
                return {
                    "id": result.config.id,
                    "previousStatus": result.config.previousStatus,
                    "confirming": result.config.confirming,
                    "status": result.status < 400 ? 'UP' : 'DOWN',
                    "statusCode": result.status,
                    "responseTime": result.responseTime,
                    "region": process.env.AWS_DEFAULT_REGION
                }
            });

            console.log(`Submitting check results: ${JSON.stringify(checkStatuses)}`);

            client.post('/probe/result', checkStatuses)
                .then((response) => {
                    console.log("Check results submitted");
                }).catch(function (error) {
                console.log("Error submitting results");
                callback(error);
            });

        }).catch((error) => {
        console.log(`Error probing checks ${JSON.stringify(error)}`);
        callback(error);
    });

    callback();
};