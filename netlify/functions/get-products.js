// Necesitarás instalar el driver de MongoDB: npm install mongodb
const { MongoClient } = require('mongodb');

// La URI se obtiene de las variables de entorno de Netlify (¡es un secreto!)
const mongoUri = process.env.MONGO_URI;

exports.handler = async function(event, context) {
    let client; // Declara el cliente fuera del bloque try para que sea accesible en finally
    try {
        if (!mongoUri) {
            console.error("Error: La variable de entorno MONGO_URI no está configurada.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error: MongoDB URI missing.' }),
            };
        }

        console.log("Intentando conectar a MongoDB...");
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log("Conexión a MongoDB exitosa.");
        
        const database = client.db('neumasur_db'); // O el nombre de tu DB
        const products = database.collection('products'); // O el nombre de tu colección
        
        console.log("Buscando productos en la colección 'products'...");
        const llantas = await products.find({}).toArray();
        console.log(`Se encontraron ${llantas.length} productos.`);
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(llantas),
        };
    } catch (error) {
        console.error("Error en la función Netlify 'get-products':", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch products', details: error.message }),
        };
    } finally {
        if (client) {
            await client.close();
            console.log("Conexión a MongoDB cerrada.");
        }
    }
};