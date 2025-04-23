import mongoose, { Schema, Document } from 'mongoose';

interface ICounter extends Document {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model<ICounter>('Counter', counterSchema);

/**
 * Generates a counter-based ID for a given collection
 * @param collectionName The name of the collection to generate an ID for
 * @returns A unique numeric ID for the collection
 */
export async function generateCounterId(collectionName: string): Promise<number> {
  const counter = await Counter.findByIdAndUpdate(
    collectionName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

/**
 * Resets a counter to a specific value
 * @param collectionName The name of the collection to reset
 * @param value The value to set the counter to
 * @returns The new counter value
 */
export async function resetCounter(collectionName: string, value: number): Promise<number> {
  const counter = await Counter.findByIdAndUpdate(
    collectionName,
    { seq: value },
    { new: true, upsert: true }
  );
  return counter.seq;
}

/**
 * Gets the current counter value for a collection
 * @param collectionName The name of the collection
 * @returns The current counter value
 */
export async function getCurrentCounter(collectionName: string): Promise<number> {
  const counter = await Counter.findById(collectionName);
  return counter ? counter.seq : 0;
}