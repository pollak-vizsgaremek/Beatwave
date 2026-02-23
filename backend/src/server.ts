import "dotenv/config";

import app from "./app";
import config from "./config/config";  

const PORT = config.port || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});