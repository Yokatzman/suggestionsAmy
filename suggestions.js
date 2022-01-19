const { parse } = require("csv-parse");
const fs = require('fs')
const express = require('express');
const app = express();

function getScoreLatLong(userLat, userLong, destLat, destLong) {
    let latScore = 1 - ((Math.abs(userLat - destLat)) / 180)
    let longScore = 1 - ((Math.abs(userLong - destLong)) / 360)
    return Math.pow(((latScore + longScore) / 2),3)
}
function getScoreLat(userLat, destLat) {
    return latScore = Math.pow((1 - (Math.abs(userLat - destLat)) / 180),3)
}
function getScoreLong(userLong, destLong) {
    return latScore = Math.pow((1 - (Math.abs(userLong - destLong)) / 360),3)
}



const port = process.env.PORT || 80

app.listen(port, () => console.log("port is " + port));



//Initialzing Local Database - start
let cities = []
let index = 0;
fs.createReadStream('./cities_canada-usa.tsv').pipe(
    parse({ delimiter: '\t', columns: true, quote: false })
).on('data', function (entry) {
    if (index > 0) {
        let new_entry = {};
        new_entry.city = entry.name
        if (entry.admin1 == '') {
            new_entry.name = entry.name + ", " + entry.country + ", " + entry.id;
        } else {
            new_entry.name = entry.name + ", " + entry.country + ", " + entry.admin1
        }
        new_entry.latitude = entry.lat;
        new_entry.longitude = entry.long;
        cities.push(new_entry);
    }
    index++;
}).on('end', function () {
    console.log('database loaded');
})
//Initialzing Local Database - end

app.get('/suggestions', (req, res) => {

    if (!req.query.q) {
        //no location provided
        res.status(400);
        res.send("please provide location");
    } else {
        let matches = [];
        cities.forEach((obj) => {
            if (obj.city.toLowerCase().startsWith(req.query.q.toLowerCase())) {
                let score = 0;
                if (!req.query.latitude && !req.query.longitude) {
                    score = 0.5;
                } else if (!req.query.longitude) {
                    score = getScoreLat(req.query.latitude, obj.latitude);

                } else if (!req.query.latitude) {
                    score = getScoreLong(req.query.longitude, obj.longitude);
                } else {
                    score = getScoreLatLong(req.query.latitude, req.query.longitude, obj.latitude, obj.longitude);
                }
                match_obj = { name: obj.name, latitude: obj.latitude, longitude: obj.longitude, score: score };
                matches.push(match_obj);
            }

        })
        matches = matches.sort((m1, m2) => {
            return m2.score - m1.score;
        })
        res.send({ suggestions: matches });
    }

})

