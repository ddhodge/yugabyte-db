---
title: Manage access to YugabyteDB Anywhere
headerTitle: Manage YugabyteDB Anywhere users
linkTitle: Manage users
description: Use role-based access control (RBAC) in YugabyteDB Anywhere to manage users and roles.
headcontent: Invite team members to your account and manage their access
menu:
  v2024.2_yugabyte-platform:
    parent: administer-yugabyte-platform
    identifier: anywhere-rbac
    weight: 10
type: docs
---

YugabyteDB Anywhere uses a role-based access control (RBAC) model to manage access to your YugabyteDB Anywhere instance (whether via the UI or the REST API). Using roles, you can enforce the [principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) (PoLP) by ensuring that users have the precise permissions needed to fulfill their roles while mitigating the risk of unauthorized access or accidental breaches. A role defines a set of permissions that determine what features can be accessed by account users who have been assigned that role.

RBAC is also available with fine-grained control over access to universes. Fine-grained RBAC is {{<tags/feature/ea idea="509">}}; during Early Access, by default fine-grained RBAC is not enabled. See [Manage users](#manage-users).

## Users and roles

As a Super Admin or Admin, you can invite new users and manage existing users for your YugabyteDB Anywhere instance. How you add and modify users varies depending on whether you have enabled [fine-grained RBAC](#fine-grained-rbac) {{<tags/feature/ea idea="509">}}. You can only assign, create, and modify custom roles if fine-grained RBAC is enabled.

A user can interact with a YugabyteDB Anywhere instance via the UI or [REST API](../../anywhere-automation/anywhere-api/).

Users are assigned roles, which define the set of actions users can perform. If fine-grained RBAC is enabled, you can also define the set of universes to which the user has access.

YugabyteDB Anywhere includes built-in roles. If you have enabled fine-grained RBAC, you can also define custom roles for team members to restrict access to specific account features.

[API tokens](../../anywhere-automation/) generated for users are assigned the same role as the user that generated them.

### Built-in roles

The following built-in roles are available:

- **Super Admin** is the first user that is created during installation. This role has the highest level of privilege and allows all read and write actions on all YugabyteDB Anywhere resources. There can be only one Super Admin. Super Admin can perform the following:

  - Manage all resources, including universes, nodes, backup, restore, and provider configurations.
  - Manage the user access control by creating and managing users.

  For more information, see [Create admin user](../../install-yugabyte-platform/create-admin-user/).

- **Admin** has privileges that are similar to the Super Admin, except that Admin cannot manage global scope artifacts and actions, such as runtime configuration settings and LDAP authentication.

- **Backup Admin** has access to backup-related tasks, such as the following:

  - Manage database backups and restore operations.
  - Create new backups.
  - Delete any existing backup or backup schedule.
  - Edit existing backups.
  - Restore backups.

  Backup Admin has view permissions for all other resources.

- **Read Only** access level provides view permissions for the UI and API.

- **Connect Only** access level allows users to sign in and access their user profile only. This role is assigned to users who are not explicitly assigned a role.

You can't delete or edit built-in roles.

## Classic RBAC

You can invite new users to your YugabyteDB Anywhere instance as follows:

1. Navigate to **Admin > User Management > Users** and click **Add User**.

    ![Add User](/images/yp/authorization-platform/add-user-classic.png)

1. Enter the user's email.

1. Enter a password for the user to sign in with.

1. Select a [built-in role](#built-in-roles) for the user.

1. Click **Submit**.

To modify a user role, navigate to **Admin > User Management > Users**, click **Actions** that corresponds to the specific user, and choose **Edit User Role**.

To delete a user, navigate to **Admin > Access Management > Users**, click **Actions** for the user to delete, and choose **Delete User**.

## Fine-grained RBAC

Using fine-grained RBAC, you can assign built-in and custom roles to users to determine the actions they are allowed to perform, and specify the universes that they can access.

During Early Access, by default fine-grained RBAC is not enabled.

To enable the feature, use following API command:

```sh
curl --request PUT \
  --url http://{yba_host:port}/api/v1/customers/{customerUUID}/runtime_config/00000000-0000-0000-0000-000000000000/key/yb.rbac.use_new_authz \
  --header 'Content-Type: text/plain' \
  --header 'X-AUTH-YW-API-TOKEN: {api_token}' \
  --data 'true'
```

If you enable fine-grained RBAC, you can't turn it off. You should test the feature thoroughly in a development or staging environment before enabling it in your production environment.

### Manage users

To create a user, do the following:

1. Navigate to **Admin > Access Management > Users**, and click **Create User**.

    ![Add User](/images/yp/authorization-platform/add-user-2024-2.png)

1. Enter the user's email.
1. Enter a password for the user to sign in with.
1. To assign a built-in role, under **Built-in Role**, click **Assign New Built-in Role**, and select a built-in role.
1. To assign a custom role, under **Custom Role**, click **Assign New Custom Role**, and select a custom role.

    By default, users have access to all present and future universes.

    ![Custom role](/images/yp/authorization-platform/add-user-custom.png)

1. To customize access to universes, assign at least one custom role, then click **Edit Selection**, and select the universes that you want to grant access for. Select the **Include future universes** option to automatically grant this user access to any universe created in the future. Click **Confirm** when you are done.

    ![Select universes](/images/yp/authorization-platform/add-user-universe.png)

1. Click **Add User**.

To modify a user, do the following:

1. Navigate to **Admin > Access Management > Users**, click **Actions** for the user to modify, and choose **Edit Assigned Roles**.
1. To change the built-in role, under **Built-in Role**, change the role.

    To add a built-in role, click **Assign New Built-in Role**.

1. To change the custom role, under **Custom Role**, change the existing role.

    To add a custom role, click **Assign New Custom Role**.

1. To customize access to universes, assign at least one custom role, then click **Edit Selection**, and select the universes that you want to grant access for. Select the **Include future universes** option to automatically grant access to any universe created in the future. Click **Confirm** when you are done.
1. Click **Edit User**.

To delete a user, navigate to **Admin > Access Management > Users**, click **Actions** for the user to delete, and choose **Delete User**.

### Manage custom roles

As a Super Admin or Admin, you can:

- create custom roles
- clone built-in and custom roles
- modify and delete custom roles

To create a custom role, do the following:

1. Navigate to **Admin > Access Management > Roles** and click **Create Role**.

    ![Add Role](/images/yp/authorization-platform/add-role-2024-2.png)

1. Enter a name for the role.
1. Enter a description for the role.
1. Click **Select Permissions**.
1. Select the permissions to assign to the role and click **Confirm** when you are done.
1. Click **Save**.

To create a custom role from an existing role, do the following:

1. Navigate to **Admin > Access Management > Roles**, click **Actions** for the role to clone, and choose **Clone Role**.
1. Enter a name for the role.
1. Enter a description for the role.
1. Click **Edit Permissions**.
1. Select the permissions to assign to the role and click **Confirm** when you are done.
1. Click **Save**.

To edit a custom role, do the following:

1. Navigate to **Admin > Access Management > Roles**, click **Actions** for the role to edit, and choose **Edit Role**.
1. On the **Configurations** tab click **Edit Permissions**.
1. Select the permissions to assign to the role and click **Confirm** when you are done.
1. Click **Save**.

To delete a role, navigate to **Admin > Access Management > Roles**, click **Actions** for the role to edit, and choose **Edit Role**.

To view the users that have been assigned a role, navigate to **Admin > Access Management > Roles**, click **Actions** for the role, and choose **View Assigned Users**.

### Limitations

- Currently, the View Universe permission additionally requires the View Resource permission to work correctly with metrics, performance advisor, and other resources.
- Deleting backups via the delete backup API requires the Delete Resource permission, but when deleting a universe you can choose to delete the associated backups even if you only have the Delete Universe permission.
- Retrying and aborting a task can require different permissions than executing it the first time.
- Currently, when creating a user, you can select **Include Future Universes** only when you have selected all current universes.
- You may need to refresh your browser after creating a universe to apply the permissions for the newly created universe.
- The View Resource permission provides view access to all logs, task logs, and so on.
