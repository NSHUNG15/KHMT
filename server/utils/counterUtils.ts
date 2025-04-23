import mongoose from 'mongoose';

// Define a Counter schema
const counterSchema = new mongoose.Schema({
  collectionName: { type: String, required: true, unique: true },
  sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

/**
 * Get the next ID for a given collection
 * @param collectionName - Name of the collection
 * @returns The next ID
 */
export const generateCounterId = async (collectionName: string): Promise<number> => {
  const counter = await Counter.findOneAndUpdate(
    { collectionName },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
};

/**
 * Get the count of documents in a collection
 * @param collectionName - Name of the MongoDB collection
 * @returns The count of documents
 */
export const getCollectionCount = async (collectionName: string): Promise<number> => {
  try {
    if (!mongoose.connection.models[collectionName]) {
      console.log(`Collection ${collectionName} not found`);
      return 0;
    }
    
    const count = await mongoose.connection.models[collectionName].countDocuments();
    return count;
  } catch (error) {
    console.error(`Error counting ${collectionName}:`, error);
    return 0;
  }
};