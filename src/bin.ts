import { startTimer } from "./helpers/worker";
import app from "./server";

app.listen(5000, () => {
  console.log("App is running on port 5000");
  startTimer();
});