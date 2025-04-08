import { Injectable } from '@angular/core';
import { IndexedDbService } from './indexed-db.service';
import { IndicatorsDataOutput } from '@kossi-models/interfaces';
import { FunctionAsStringName } from '@kossi-models/db';

@Injectable({
    providedIn: 'root'
})
export class FunctionsService {
    
    constructor(private indexdb: IndexedDbService) { }
    
    async executeIndexDBStoredFunction<T>(functionName: FunctionAsStringName, reports: T[]|undefined|null, reports2: any = undefined, has2Params:boolean = false): Promise<IndicatorsDataOutput<T|T[]> | undefined> {
        try {
            if (!reports || reports.length == 0) return undefined;
            
            const functionString = await this.indexdb.getOne<string>('token', functionName);
            if (!functionString) return undefined;

            const functionObj: { id: string, data: string } = typeof functionString === 'string' ? JSON.parse(functionString) : functionString;
            if (!functionObj?.data) return undefined;

            const realFunction = functionObj.data;

            if (typeof realFunction !== 'string') {
                console.error('Decoded function is not a valid string');
                return undefined;
            }
            let dataToReturn;

            if (has2Params == true) {
                const dynamicFunction = new Function(`return ${realFunction};`)(reports, reports2);
                dataToReturn = await dynamicFunction(reports, reports2);
            } else {
                const dynamicFunction = new Function(`return ${realFunction};`)(reports);
                dataToReturn = await dynamicFunction(reports);
            }

            return dataToReturn;
        } catch (error) {
            console.error('Error executing dynamic function:', error);
            return undefined;
        }
    }

}
