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

module.exports.handler = (event, context, callback) => {
    const region = process.env.AWS_DEFAULT_REGION;
    const topic = process.env.CHECKS_TOPIC;
    AWS.config.update({region: region});
    const sns = new AWS.SNS();
    const http = axios.create({
        baseURL: process.env.API_URL,
        timeout: 10000
    });

    console.log(`Acquiring candidates from ${process.env.API_URL + "/check/candidate"} for region ${region}`);

    http.post('/probe/candidate', {
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