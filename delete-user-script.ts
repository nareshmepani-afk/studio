
    const { deleteUser } = require('./src/actions/deleteUserAction');

    const uidToDelete = 'pjkbZGEojiffirfAwza50dK4WkM2';

    async function runDelete() {
      const result = await deleteUser(uidToDelete);
      console.log(result);
    }

    runDelete();
    