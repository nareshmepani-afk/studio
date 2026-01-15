
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-memory-cues.ts';
import '@/ai/tools/get-coffee-price-tool';
import '@/ai/flows/get-pass-price-flow';
import '@/ai/flows/get-host-pass-price-flow.ts'; // Added new host pass price flow
import '@/ai/flows/generate-memory-description-flow.ts'; // Added memory description flow

