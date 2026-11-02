import { runReminderJob } from "../src/lib/events/runReminders";

runReminderJob()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
