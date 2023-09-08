import { useMemo } from 'react';
import { IoTrashBinOutline } from 'react-icons/io5';
import { randomString } from '@togglecorp/fujs';
import {
    TextInput,
    QuickActionButton,
} from '@the-deep/deep-ui';
import {
    SetValueArg,
    useFormObject,
    Error,
    getErrorObject,
} from '@togglecorp/toggle-form';

import { type ChoiceType } from '#components/AddChoiceCollectionModal';

import styles from './index.module.css';

type Value = ChoiceType;

interface Props {
    value: Value;
    onChange: (value: SetValueArg<Value>, index: number | undefined) => void;
    index: number;
    onRemove: (index: number) => void;
    error: Error<Value> | undefined;
}

function AddChoicesInput(props: Props) {
    const {
        onChange,
        index,
        error: formError,
        onRemove,
        value,
    } = props;

    const defaultValue = useMemo(
        () => ({
            clientId: randomString(),
        }),
        [],
    );
    const error = getErrorObject(formError);

    const onFieldChange = useFormObject(
        index,
        onChange,
        defaultValue,
    );

    return (
        <div className={styles.optionList}>
            <div className={styles.option}>
                <TextInput
                    name="label"
                    value={value?.label}
                    onChange={onFieldChange}
                    rows={2}
                    error={error?.label}
                />
                <TextInput
                    name="name"
                    value={value?.name}
                    onChange={onFieldChange}
                    rows={2}
                    error={error?.name}
                />
            </div>
            <QuickActionButton
                name={index}
                onClick={onRemove}
                variant="secondary"
            >
                <IoTrashBinOutline />
            </QuickActionButton>
        </div>
    );
}

export default AddChoicesInput;
