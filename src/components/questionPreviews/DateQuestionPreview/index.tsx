import {
    MdOutlineCalendarMonth,
} from 'react-icons/md';
import {
    _cs,
} from '@togglecorp/fujs';
import {
    TextOutput,
    DateInput,
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
            <DateInput
                name={undefined}
                placeholder="Select Date"
                value={undefined}
                icons={<MdOutlineCalendarMonth />}
                readOnly
            />
        </div>
    );
}

export default DateQuestionPreview;
