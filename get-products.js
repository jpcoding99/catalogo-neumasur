// Necesitarás instalar el driver de MongoDB: npm install mongodb
const { MongoClient } = require('mongodb');

// La URI se obtiene de las variables de entorno de Netlify (¡es un secreto!)
const mongoUri = process.env.MONGO_URI;

exports.handler = async function(event, context) {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        
        const database = client.db('neumasur_db'); // O el nombre de tu DB
        const products = database.collection('products'); // O el nombre de tu colección
        
        const llantas = await products.find({}).toArray();
        
        await client.close();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(llantas),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch products' }),
        };
    }
};