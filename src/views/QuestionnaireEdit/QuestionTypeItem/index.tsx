import {
    Button,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

// TODO: Fetch this from server
export interface QuestionType {
    key: string;
    name: string;
    icon: React.ReactNode;
}

interface Props {
    name: string;
    questionType: QuestionType;
    onQuestionClick: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function QuestionTypeItem(props: Props) {
    const {
        name,
        questionType,
        onQuestionClick,
    } = props;

    return (
        <Button
            className={styles.type}
            name={name}
            icons={questionType.icon}
            onClick={onQuestionClick}
            variant="tertiary"
        >
            {questionType.name}
        </Button>
    );
}
export default QuestionTypeItem;
