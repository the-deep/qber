import { useMemo } from 'react';
import { IoTrashBinOutline } from 'react-icons/io5';
import { randomString } from '@togglecorp/fujs';
import {
    Element,
    TextInput,
    QuickActionButton,
} from '@the-deep/deep-ui';
import {
    SetValueArg,
    useFormObject,
    Error,
    getErrorObject,
} from '@togglecorp/toggle-form';

import { type ChoiceType } from '..';

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
        <Element
            childrenContainerClassName={styles.options}
            actions={(
                <QuickActionButton
                    name={index}
                    onClick={onRemove}
                    variant="secondary"
                >
                    <IoTrashBinOutline />
                </QuickActionButton>
            )}
        >
            <TextInput
                name="label"
                placeholder="Enter option label"
                className={styles.input}
                value={value?.label}
                onChange={onFieldChange}
                error={error?.label}
                autoFocus
            />
            <TextInput
                name="name"
                placeholder="Enter option name"
                className={styles.input}
                value={value?.name}
                onChange={onFieldChange}
                error={error?.name}
            />
        </Element>
    );
}

export default AddChoicesInput;
