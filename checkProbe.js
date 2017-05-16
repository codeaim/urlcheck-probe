'use strict';

const axios = require('axios');

module.exports.checkProbe = (event, context, callback) => {
    const checks = JSON.parse(event.Records[0].Sns.Message);
    const http = axios.create({
        baseURL: process.env.API_URL,
        timeout: 6000
    });

    http.interceptors.request.use((config) => {
        return Object.assign(config, {"start": Date.now()});
    });

    http.interceptors.response.use((response) => {
        return Object.assign(response, {"responseTime": Date.now() - response.config.start});
    });

    const checkRequests = checks.map((check) => {
        console.log(`Probe check ${check.id} requesting ${check.protocol}://${check.url}`);
        return http.get(`${check.protocol}://${check.url}`, {
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

            http.post('/check/result', checkStatuses)
                .then((response) => {
                    console.log("Check results submitted");
                }).catch(function (error) {
                    console.log("Error submitting results");
                    callback(error);
                });

        }).catch((error) => {
            console.log("Error probing checks");
            callback(error);
        });

    callback();
};