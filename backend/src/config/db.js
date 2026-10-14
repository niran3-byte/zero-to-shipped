import mongoose from "mongoose";

/**
 * Connect to MongoDB.
 *
 * Returns true on success, false if the server is unreachable. We deliberately
 * do NOT throw: scoring a resume does not need the database, and a learner who
 * has not started mongod yet should still get a working app. The caller logs
 * loudly about the consequence (analyses are not persisted).
 */
export async function connectDB(uri) {
  try {
    // Stop waiting after 5s instead of the 30s default, so a missing mongod
    // shows up as a fast, readable error rather than a hung startup.
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[db] connected to ${mongoose.connection.name}`);
    return true;
  } catch (err) {
    console.warn(`[db] could not connect: ${err.message}`);
    return false;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
