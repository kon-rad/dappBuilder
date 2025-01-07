import { LocalIndex } from 'vectra';
import path from 'path';

export async function getVectraClient() {
    // Create a new LocalIndex instance pointing to a 'vectors' directory in your project
    const index = new LocalIndex(path.join(process.cwd(), 'vectors'));
    
    // Create the index if it doesn't exist
    if (!await index.isIndexCreated()) {
        await index.createIndex();
    }
    
    return index;
} 