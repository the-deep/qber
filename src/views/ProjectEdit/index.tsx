import {
    useMemo,
    useContext,
    useState,
    useCallback,
} from 'react';
import {
    useParams,
} from 'react-router-dom';
import { IoAddOutline } from 'react-icons/io5';
import { gql, useQuery, useMutation } from '@apollo/client';
import { isDefined, isNotDefined } from '@togglecorp/fujs';
import {
    createStringColumn,
    Button,
    TableView,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    TextInput,
    Header,
    Heading,
    useModalState,
    useAlert,
} from '@the-deep/deep-ui';
import {
    ObjectSchema,
    createSubmitHandler,
    requiredStringCondition,
    getErrorObject,
    useForm,
    PartialForm,
} from '@togglecorp/toggle-form';

import SubNavbar from '#components/SubNavbar';
import {
    MembershipsQuery,
    MembershipsQueryVariables,
    DeleteMembershipMutation,
    DeleteMembershipMutationVariables,
    UpdateProjectMutation,
    UpdateProjectMutationVariables,
    ProjectUpdateInput,
} from '#generated/types';

import UserContext from '#contexts/user';
import ActionCell, { Props as ActionCellProps } from '#components/EditDeleteActionCell';
import ProjectMembershipEditModal, { Member } from '#components/ProjectMembershipEditModal';

import styles from './index.module.css';

const MEMBERSHIPS = gql`
    query Memberships(
        $projectId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                project {
                    id
                    title
                    createdAt
                    modifiedAt
                    members {
                        items {
                            addedById
                            clientId
                            id
                            joinedAt
                            memberId
                            role
                            member {
                                displayName
                                firstName
                                id
                                lastName
                            }
                        }
                        count
                    }
                    title
                }
            }
        }
        projectMembershipRoleTypeOptions: __type(name: "ProjectMembershipRoleTypeEnum") {
            enumValues {
                name
                description
            }
        }
    }
`;

const UPDATE_PROJECT = gql`
    mutation UpdateProject (
        $projectId: ID!,
        $input: ProjectUpdateInput!,
    ) {
        private {
            projectScope(pk: $projectId) {
                updateProject(data: $input) {
                    errors
                    ok
                    result {
                        id
                        title
                    }
                }
            }
        }
    }
`;

type FormType = PartialForm<ProjectUpdateInput>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: () : FormSchemaFields => ({
        title: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
    }),
};

const DELETE_MEMBERSHIP = gql`
    mutation DeleteMembership(
        $projectId: ID!,
        $membershipIdToDelete: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                id
                updateMemberships(deleteIds: [$membershipIdToDelete]) {
                    errors
                    results {
                        id
                    }
                }
            }
        }
    }
`;

const memberKeySelector = (mem: Member) => mem.id;

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { projectId } = useParams<{ projectId: string }>();
    const {
        userDetails,
    } = useContext(UserContext);

    const [
        membershipEditModalShown,
        showMembershipEditModal,
        hideMembershipEditModal,
    ] = useModalState(false);

    const activeUserId = userDetails ? userDetails.id : undefined;

    const [
        selectedMemberData,
        setSelectedMemberData,
    ] = useState<Member>();

    const alert = useAlert();

    const variables = useMemo(() => {
        if (isNotDefined(projectId)) {
            return undefined;
        }
        return ({
            projectId,
        });
    }, [projectId]);

    const initialFormValue: FormType = {};
    const {
        pristine,
        validate,
        value: formValue,
        error: formError,
        setValue,
        setFieldValue,
        setError,
    } = useForm(schema, { value: initialFormValue });

    const {
        data: membershipsResponse,
        loading: membershipsLoading,
        refetch: retriggerMemberships,
    } = useQuery<MembershipsQuery, MembershipsQueryVariables>(
        MEMBERSHIPS,
        {
            skip: isNotDefined(variables),
            variables,
            onCompleted: (response) => {
                const projectDetails = response?.private?.projectScope?.project;
                setValue({
                    title: projectDetails?.title,
                });
            },
        },
    );

    const fieldError = getErrorObject(formError);
    const handleEditButtonClick = useCallback((data: Member) => {
        showMembershipEditModal();
        setSelectedMemberData(data);
    }, [showMembershipEditModal]);

    const [
        triggerProjectUpdate,
        { loading: projectUpdatePending },
    ] = useMutation<UpdateProjectMutation, UpdateProjectMutationVariables>(
        UPDATE_PROJECT,
        {
            onCompleted: (projectResponse) => {
                const response = projectResponse?.private?.projectScope?.updateProject;
                if (!response) {
                    return;
                }
                if (response.ok) {
                    alert.show(
                        'Project updated successfully.',
                        { variant: 'success' },
                    );
                    const projectDetail = response.result;
                    setValue({
                        title: projectDetail?.title,
                    });
                } else {
                    alert.show(
                        'Failed to update project.',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to update project.',
                    { variant: 'error' },
                );
            },
        },
    );

    const [
        triggerMembershipDelete,
    ] = useMutation<DeleteMembershipMutation, DeleteMembershipMutationVariables>(
        DELETE_MEMBERSHIP,
        {
            onCompleted: (memberResponse) => {
                const response = memberResponse?.private?.projectScope?.updateMemberships;
                if (!response) {
                    return;
                }
                if (response.errors?.length === 0) {
                    retriggerMemberships();
                    alert.show(
                        'Member deleted successfully.',
                        { variant: 'success' },
                    );
                } else {
                    alert.show(
                        'Failed to delete member.',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to delete member.',
                    { variant: 'error' },
                );
            },
        },
    );

    const handleDeleteMembershipClick = useCallback((membershipId: string) => {
        if (isNotDefined(projectId)) {
            return;
        }
        triggerMembershipDelete({
            variables: {
                projectId,
                membershipIdToDelete: membershipId,
            },
        });
    }, [
        triggerMembershipDelete,
        projectId,
    ]);

    const members = membershipsResponse?.private.projectScope?.project.members.items;

    const columns = useMemo(
        () => {
            const actionColumn: TableColumn<
                Member, string, ActionCellProps<string>, TableHeaderCellProps
            > = {
                id: 'action',
                title: 'Actions',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (membershipId, data) => ({
                    itemKey: membershipId,
                    onEditClick: () => handleEditButtonClick(data),
                    onDeleteClick: () => handleDeleteMembershipClick(membershipId),
                    disabled: data.memberId === activeUserId,
                    editButtonTitle: 'Edit membership role',
                    deleteButtonTitle: 'Delete membership from project',
                    deleteConfirmationMessage: 'Are you sure you wish to delete this membership?',
                }),
            };
            return ([
                createStringColumn<Member, string>(
                    'name',
                    'Name',
                    (item) => item.member.displayName,
                ),
                createStringColumn<Member, string>(
                    'role',
                    'Role',
                    (item) => item.role,
                ),
                actionColumn,
            ]);
        },
        [
            activeUserId,
            handleEditButtonClick,
            handleDeleteMembershipClick,
        ],
    );

    const handleAddNewMembershipClick = useCallback(() => {
        setSelectedMemberData(undefined);
        showMembershipEditModal();
    }, [
        showMembershipEditModal,
    ]);

    const handleSubmit = useCallback(() => {
        if (isNotDefined(projectId)) {
            return;
        }
        const handler = createSubmitHandler(
            validate,
            setError,
            (val) => {
                triggerProjectUpdate({
                    variables: {
                        input: val,
                        projectId,
                    },
                });
            },
        );

        handler();
    }, [
        setError,
        triggerProjectUpdate,
        validate,
        projectId,
    ]);

    return (
        <div className={styles.projectEdit}>
            <SubNavbar
                onCloseLink="/"
            />
            <div className={styles.content}>
                <form className={styles.editFields}>
                    <Heading>
                        Project Details
                    </Heading>
                    <TextInput
                        name="title"
                        label="Project Title"
                        value={formValue?.title}
                        error={fieldError?.title}
                        onChange={setFieldValue}
                    />
                    <Button
                        className={styles.submitButton}
                        name={undefined}
                        onClick={handleSubmit}
                        disabled={
                            pristine
                            || projectUpdatePending
                        }
                    >
                        Save
                    </Button>
                </form>
                <Header
                    heading="Project Members"
                    actions={(
                        <Button
                            name={undefined}
                            icons={<IoAddOutline />}
                            onClick={handleAddNewMembershipClick}
                            className={styles.addMemberButton}
                        >
                            Add members
                        </Button>
                    )}
                />
                <TableView
                    data={members}
                    keySelector={memberKeySelector}
                    columns={columns}
                    rowClassName={styles.tableRow}
                    pending={membershipsLoading}
                    errored={false}
                    filtered={false}
                    emptyMessage="No members found"
                    messageShown
                />
            </div>
            {membershipEditModalShown && isDefined(projectId) && (
                <ProjectMembershipEditModal
                    projectId={projectId}
                    selectedMember={selectedMemberData ?? undefined}
                    onClose={hideMembershipEditModal}
                    onSuccess={retriggerMemberships}
                />
            )}
        </div>
    );
}
Component.displayName = 'ProjectEdit';
