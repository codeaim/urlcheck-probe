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

    AWS.config.update({region: region});

    const http = axios.create({
        baseURL: process.env.API_URL,
        timeout: 1000
    });

    http.post('/candidate', {
        region: region
    }).then((response) => {
        chunk(response, process.env.CHUNK_SIZE).map((checks) => {
            new AWS.SNS().publish({
                Message: checks,
                TopicArn: process.env.CHECKS_TOPIC
            });
        });
        callback();
    }).catch((error) => {
        callback(error);
    });
};