const fs = require('fs');

exports.validateLength = (str, min, max) => {
    return str.length > min && str.length < max;
}

exports.readIdeasData = () => {
    const data = fs.readFileSync(`${__dirname}/../dev-data/ideas.json`, 'utf-8');
    return JSON.parse(data);
}

exports.writeIdeasData = function(data, callback){
    fs.writeFile(`${__dirname}/../dev-data/ideas.json`, JSON.stringify(data, null, 2), 'utf-8', (err)=>{
        if(err) return callback(err);
        callback(null);
    });
}


