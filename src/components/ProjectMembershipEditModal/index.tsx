import { useCallback, useMemo, useState } from 'react';
import {
    SelectInput,
    Modal,
    Button,
    useAlert,
} from '@the-deep/deep-ui';
import { isDefined, isNotDefined } from '@togglecorp/fujs';
import { gql, useMutation, useQuery } from '@apollo/client';
import {
    ObjectSchema,
    PartialForm,
    createSubmitHandler,
    requiredStringCondition,
    getErrorObject,
    useForm,
} from '@togglecorp/toggle-form';

import NonFieldError from '#components/NonFieldError';
import UserSelectInput, { User } from '#components/UserSelectInput';
import {
    ProjectMembershipUpdateInput,
    RolesQuery,
    MembershipsQuery,
    UpdateMembershipMutation,
    UpdateMembershipMutationVariables,
    ProjectMembershipRoleTypeEnum,
} from '#generated/types';
import {
    EnumOptions,
    EnumEntity,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import styles from './index.module.css';

type ProjectMembershipRoleOptions = EnumOptions<ProjectMembershipRoleTypeEnum>;

type ProjectMembershipRoleOption = EnumEntity<ProjectMembershipRoleTypeEnum>;

const UPDATE_MEMBERSHIP = gql`
    mutation UpdateMembership(
        $projectId: ID!,
        $userId: ID,
        $role: ProjectMembershipRoleTypeEnum,
        $membershipId: ID,
    ) {
        private {
            projectScope(pk: $projectId) {
                id
                updateMemberships(
                    items: {
                        role: $role,
                        member: $userId,
                        id: $membershipId,
                    },
                    deleteIds: []
                ) {
                    errors
                    results {
                        id
                        clientId
                        role
                        memberId
                        addedById
                    }
                }
            }
        }
    }
`;

const ROLES = gql`
    query Roles {
        projectMembershipRoleTypeOptions: __type(name: "ProjectMembershipRoleTypeEnum") {
            enumValues {
                name
                description
            }
        }
    }
`;

const roleKeySelector = (r: ProjectMembershipRoleOption) => r.name;
const roleLabelSelector = (r: ProjectMembershipRoleOption) => r.description || r.name;

export type Member = NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<MembershipsQuery['private']>['projectScope']>['project']>['members']>['items']>[number]>;

type FormType = PartialForm<ProjectMembershipUpdateInput>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: () : FormSchemaFields => ({
        id: {},
        member: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        role: {
            required: true,
        },
    }),
};

export type ProjectMembershipType = NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<MembershipsQuery['private']>['projectScope']>['project']>['members']>['items']>[number];

interface MembershipProps {
    projectId: string;
    selectedMember?: Member;
    onClose: () => void;
    onSuccess: () => void;
}

function ProjectMembershipEditModal(props: MembershipProps) {
    const {
        projectId,
        selectedMember,
        onClose,
        onSuccess,
    } = props;

    const editMode = isDefined(selectedMember);

    const [
        userOptions,
        setUserOptions,
    ] = useState<User[] | undefined | null>(
        selectedMember ? [selectedMember.member] : undefined,
    );

    const alert = useAlert();

    const {
        data: roles,
    } = useQuery<RolesQuery>(
        ROLES,
    );

    const [
        triggerMembershipUpdate,
        { loading: membershipUpdatePending },
    ] = useMutation<UpdateMembershipMutation, UpdateMembershipMutationVariables>(
        UPDATE_MEMBERSHIP,
        {
            onCompleted: (memberResponse) => {
                const response = memberResponse?.private?.projectScope?.updateMemberships;
                if (!response) {
                    return;
                }
                if (response.errors?.length === 0) {
                    onSuccess();
                    onClose();
                    alert.show(
                        'Membership updated successfully.',
                        { variant: 'success' },
                    );
                } else {
                    alert.show(
                        'Failed to update membership.',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to update membership.',
                    { variant: 'error' },
                );
            },
        },
    );

    const initialFormValue: FormType = useMemo(() => {
        if (isNotDefined(selectedMember)) {
            return {};
        }
        return ({
            id: selectedMember.id,
            member: selectedMember.memberId,
            role: selectedMember.role,
            clientId: selectedMember.clientId,
        });
    }, [
        selectedMember,
    ]);

    const {
        pristine,
        value: formValue,
        error,
        validate,
        setError,
        setFieldValue,
    } = useForm(schema, { value: initialFormValue });

    const fieldError = getErrorObject(error);

    const handleSubmit = useCallback(() => {
        const handler = createSubmitHandler(
            validate,
            setError,
            (val) => {
                triggerMembershipUpdate({
                    variables: {
                        userId: val.member,
                        membershipId: val.id,
                        role: val.role,
                        projectId,
                    },
                });
            },
        );
        handler();
    }, [
        projectId,
        setError,
        triggerMembershipUpdate,
        validate,
    ]);

    return (
        <Modal
            className={styles.item}
            heading="Edit Memberships"
            onCloseButtonClick={onClose}
            size="small"
            freeHeight
            footerActions={(
                <Button
                    name={undefined}
                    onClick={handleSubmit}
                    disabled={
                        pristine
                        || membershipUpdatePending
                    }
                >
                    Save
                </Button>
            )}
        >
            <form className={styles.fields}>
                <NonFieldError error={error} />
                <UserSelectInput
                    name="member"
                    label="User"
                    className={styles.input}
                    value={formValue.member}
                    error={fieldError?.member}
                    onChange={setFieldValue}
                    readOnly={editMode}
                    options={userOptions}
                    excludeMembersFromProjectId={projectId}
                    onOptionsChange={setUserOptions}
                    nonClearable
                />
                <SelectInput
                    name="role"
                    label="Role"
                    className={styles.input}
                    options={(
                        roles?.projectMembershipRoleTypeOptions?.enumValues as
                        ProjectMembershipRoleOptions
                    )}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    value={formValue.role}
                    error={fieldError?.role}
                    onChange={setFieldValue}
                    nonClearable
                />
            </form>
        </Modal>
    );
}

export default ProjectMembershipEditModal;
