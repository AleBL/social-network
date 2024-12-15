const Neode = require('neode');

const neode = new Neode(process.env.NEO4J_URI, process.env.NEO4J_USER, process.env.NEO4J_PASSWORD);

module.exports = neode;
