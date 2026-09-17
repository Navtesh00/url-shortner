import dotenv from "dotenv";
import databaseConnection from "./src/config/database.js";
import app from "./src/app.js"

dotenv.config({path: "./.env"});

try{
    await databaseConnection();
    app.on("error", (error) => {
        console.error("Error:", error);
        throw error;
    });

    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });

}catch (error){
    console.error("Error:", error);
    process.exit(1);
}