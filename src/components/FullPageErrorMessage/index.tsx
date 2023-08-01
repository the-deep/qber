import { _cs } from '@togglecorp/fujs';
import {
    ButtonLikeLink,
} from '@the-deep/deep-ui';
import styles from './index.module.css';

interface Props {
    errorTitle?: string;
    errorMessage?: React.ReactNode;
    hideGotoHomepageButton?: boolean;
    className?: string;
}

// eslint-disable-next-line import/prefer-default-export
export function Component(props: Props) {
    const {
        errorTitle,
        errorMessage,
        hideGotoHomepageButton = false,
        className,
    } = props;

    return (
        <div className={_cs(styles.errorPage, className)}>
            <div className={styles.logoContainer}>
                <img
                    src="/logo.png"
                    className={styles.logo}
                    alt="Questionnaire Builder Logo"
                />
                <div className={styles.tagline}>
                    Lorem ipsum dolor sit amet consectetur.
                    jahsdhjakasdbkjabd jkhdakjhasdkjbnajksd
                    b
                </div>
            </div>
            <div className={styles.message}>
                <h2 className={styles.errorMessageTitle}>
                    {errorTitle}
                </h2>
                <div className={styles.errorMessage}>
                    {errorMessage}
                </div>
                <div className={styles.buttons}>
                    {!hideGotoHomepageButton && (
                        <ButtonLikeLink
                            variant="primary"
                            to="/"
                        >
                            Go to homepage
                        </ButtonLikeLink>
                    )}
                </div>
            </div>
        </div>
    );
}

Component.displayName = 'FullPageErrorMessage';
