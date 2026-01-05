
const { deleteUser } = require('./src/actions/deleteUserAction.ts');

const uid = 'pjkbZGEojiffirfAwza50dK4WkM2';

deleteUser(uid)
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
