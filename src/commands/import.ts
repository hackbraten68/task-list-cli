import { importTasks } from "../storage.ts";
import { ImportOptions } from "../types.ts";

export async function importCommand(options: {
    format: string;
    input: string;
    mode?: string;
    'validate-only'?: boolean;
}) {
    try {
        const importOptions: ImportOptions = {
            format: (options.format === 'csv' ? 'csv' : 'json') as 'json' | 'csv',
            inputPath: options.input,
            mode: (options.mode === 'replace' ? 'replace' : 'merge') as 'merge' | 'replace',
            validateOnly: options['validate-only'] || false
        };

        const result = await importTasks(importOptions);

        if (result.success) {
            console.log(`✅ ${result.message}`);
            if (result.importedCount !== undefined) {
                console.log(`📊 ${result.importedCount} tasks processed`);
            }
        } else {
            console.error(`❌ ${result.message}`);
            if (result.errors) {
                result.errors.forEach(error => console.error(`   - ${error}`));
            }
            Deno.exit(1);
        }

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ Import failed: ${message}`);
        Deno.exit(1);
    }
}