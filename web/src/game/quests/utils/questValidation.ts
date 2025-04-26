import { Quest, QuestStep, QuestValidationType } from '../types/quest';

export class QuestValidator {
    static validateQuestStep(step: QuestStep, eventType: string, eventData: any): boolean {
        const { validation } = step;

        switch (validation.type) {
            case QuestValidationType.CLIENT_EVENT:
                return this.validateClientEvent(validation.params, eventType, eventData);
            
            case QuestValidationType.COMPOUND:
                return this.validateCompoundCondition(validation.params, eventType, eventData);
            
            case QuestValidationType.SERVER_STATE:
                // Will be implemented when we add server-side validation
                return false;
            
            default:
                console.warn(`Unknown validation type for quest step ${step.id}`);
                return false;
        }
    }

    static validateQuestCompletion(quest: Quest, eventType: string, eventData: any): boolean {
        // A quest is complete when all its steps are complete
        // This method checks if the current event completes any steps
        // The actual tracking of completed steps should be done by the QuestController
        return quest.steps.some(step => this.validateQuestStep(step, eventType, eventData));
    }

    private static validateClientEvent(params: any, eventType: string, eventData: any): boolean {
        if (params.event !== eventType) return false;

        // Check all parameters match
        return Object.entries(params).every(([key, value]) => {
            if (key === 'event') return true; // Already checked
            return eventData[key] === value;
        });
    }

    private static validateCompoundCondition(params: any, eventType: string, eventData: any): boolean {
        const { conditions, requireAll = true } = params;
        
        if (!Array.isArray(conditions)) {
            console.warn('Compound validation requires an array of conditions');
            return false;
        }

        const validationResults = conditions.map(condition => 
            this.validateClientEvent(condition, eventType, eventData)
        );

        return requireAll 
            ? validationResults.every(result => result)
            : validationResults.some(result => result);
    }
}
