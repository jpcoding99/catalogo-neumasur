const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno si usamos un archivo .env localmente
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;
// La carpeta 'public' es un buen lugar para archivos estáticos, o la raíz.
// Usaremos la raíz para que sea más simple de encontrar en el fetch.
const outputPath = path.join(__dirname, 'data.json'); 

async function fetchData() {
    if (!mongoUri) {
        console.error("Error: La variable de entorno MONGO_URI no está configurada.");
        process.exit(1); // Termina el script con un error
    }

    let client;
    console.log("Iniciando script de build: Conectando a MongoDB...");

    try {
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log("Conexión a MongoDB exitosa.");

        const database = client.db('neumasur_db');
        const productsCollection = database.collection('products');

        const products = await productsCollection.find({}).toArray();
        console.log(`Se encontraron ${products.length} productos.`);

        // Escribir los datos en el archivo JSON
        fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
        console.log(`Datos guardados exitosamente en ${outputPath}`);

    } catch (error) {
        console.error("Error durante el script de build:", error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log("Conexión a MongoDB cerrada.");
        }
    }
}

fetchData();
