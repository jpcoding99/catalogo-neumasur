const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGO_URI;
const adminSecret = process.env.ADMIN_SECRET_KEY; // Nueva variable de entorno

exports.handler = async function(event, context) {
    // 1. Solo permitir peticiones POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // 2. Comprobar la llave secreta de administrador
    const providedSecret = event.headers['x-admin-secret'];
    if (!providedSecret || providedSecret !== adminSecret) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    let client;
    try {
        const productsToSave = JSON.parse(event.body);
        if (!Array.isArray(productsToSave)) {
            return { statusCode: 400, body: 'Bad Request: Body must be a JSON array of products.' };
        }

        client = new MongoClient(mongoUri);
        await client.connect();
        
        const database = client.db('neumasur_db');
        const productsCollection = database.collection('products');
        
        // Estrategia: Borrar todo y volver a insertar. Es simple y efectivo para este caso.
        console.log("Eliminando productos antiguos...");
        await productsCollection.deleteMany({});
        
        console.log(`Insertando ${productsToSave.length} nuevos productos...`);
        if (productsToSave.length > 0) {
            await productsCollection.insertMany(productsToSave);
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Base de datos actualizada con ${productsToSave.length} productos.` }),
        };

    } catch (error) {
        console.error("Error en la función 'update-products':", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to update products', details: error.message }),
        };
    } finally {
        if (client) {
            await client.close();
            console.log("Conexión a MongoDB cerrada.");
        }
    }
};
