import {
    isNotDefined,
} from '@togglecorp/fujs';
import {
    type Error,
    analyzeErrors,
    getErrorObject,
} from '@togglecorp/toggle-form';

const generalFields = [
    'name',
    'label',
    'hint',
    'choiceCollection',
    'constraint',
];

const metadataFields = [
    'priorityLevel',
    'enumeratorSkill',
    'dataCollectionMethod',
    'requiredDuration',
];

const tabToFieldsMap = {
    general: generalFields,
    metadata: metadataFields,
};

export type TabKeys = 'general' | 'metadata';

export default function checkTabErrors<T>(error: Error<T> | undefined, tabKey: TabKeys) {
    if (isNotDefined(analyzeErrors(error))) {
        return false;
    }

    const fields = tabToFieldsMap[tabKey];
    const fieldErrors = getErrorObject(error);

    const hasErrorOnAnyField = fields.some(
        (field) => {
            const fieldError = fieldErrors?.[field];
            const isErrored = analyzeErrors<unknown>(fieldError);
            return isErrored;
        },
    );

    return hasErrorOnAnyField;
}
