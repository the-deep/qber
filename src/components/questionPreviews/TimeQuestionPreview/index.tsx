import {
    MdOutlineSchedule,
} from 'react-icons/md';
import {
    _cs,
} from '@togglecorp/fujs';
import {
    TextOutput,
    TimeInput,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
}

function DateQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
    } = props;

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                value={label ?? 'Enter Question Label'}
                description={hint ?? 'Enter hint'}
                spacing="none"
                block
            />
            <TimeInput
                name={undefined}
                placeholder="Select Date"
                value={undefined}
                icons={<MdOutlineSchedule />}
                readOnly
            />
        </div>
    );
}

export default DateQuestionPreview;
