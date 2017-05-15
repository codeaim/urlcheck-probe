'use strict';

const AWS = require("aws-sdk");
const axios = require('axios');

const chunk = (array, size) => {
    let results = [];
    while (array.length) {
        results.push(array.splice(0, size));
    }
    return results
};

module.exports.checkAcquire = (event, context, callback) => {
    const region = process.env.AWS_DEFAULT_REGION;
    const topic = process.env.CHECKS_TOPIC;
    AWS.config.update({region: region});
    const sns = new AWS.SNS();
    const http = axios.create({
        baseURL: process.env.API_URL,
        timeout: 10000
    });

    console.log(`Acquiring candidates from ${process.env.API_URL} for region ${region}`);

    http.post('/check/candidate', {
        region: region
    }).then((response) => {
        if (response.data.length) {
            Promise.all(chunk(response.data, process.env.CHUNK_SIZE).map((checks) => {
                const checksJson = JSON.stringify(checks);
                console.log(`Publishing ${checksJson} to ${topic}`);
                sns.publish({
                    Message: checksJson,
                    TopicArn: topic
                }).promise();
            })).then(() => {
                callback();
            }).catch((reason) => {
                console.log(reason)
            });
        }
        callback();
    }).catch((error) => {
        console.log(`error: ${error}`);
        callback(error);
    });
};

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
        return http.get(`${check.protocol}://${check.url}`, {"id": check.id});
    });

    axios.all(checkRequests)
        .then((results) => {
            const checkStatuses = results.map((result) => {
                return {
                    "id": result.config.id,
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