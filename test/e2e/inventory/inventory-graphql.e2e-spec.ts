import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { gql } from '../../helpers/graphql-client';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'inventory-gql-a@example.com';
const EMAIL_B = 'inventory-gql-b@example.com';

const REGISTER_MUTATION = `
  mutation Register($input: RegisterAccountInput!) {
    register(input: $input)
  }
`;

const LOGIN_MUTATION = `
  mutation Login($input: LoginUserInput!) {
    login(input: $input) {
      accessToken
    }
  }
`;

const CREATE_MUTATION = `
  mutation InventoryItemCreate($input: CreateInventoryItemInput!) {
    inventoryItemCreate(input: $input) {
      success
      message
      id
    }
  }
`;

const ADJUST_MUTATION = `
  mutation InventoryItemAdjustQuantity($input: AdjustInventoryItemQuantityInput!) {
    inventoryItemAdjustQuantity(input: $input) {
      success
      id
    }
  }
`;

const UPDATE_MUTATION = `
  mutation InventoryItemUpdate($input: UpdateInventoryItemInput!) {
    inventoryItemUpdate(input: $input) {
      success
      id
    }
  }
`;

const DELETE_MUTATION = `
  mutation InventoryItemDelete($id: String!) {
    inventoryItemDelete(id: $id) {
      success
      id
    }
  }
`;

const DELETE_BULK_MUTATION = `
  mutation InventoryItemsDeleteBulk($input: DeleteInventoryItemsBulkInput!) {
    inventoryItemsDeleteBulk(input: $input) {
      deletedIds
      notFoundIds
      deletedCount
      requestedCount
    }
  }
`;

const FIND_BY_ID_QUERY = `
  query InventoryItemFindById($input: InventoryItemFindByIdInput!) {
    inventoryItemFindById(input: $input) {
      id
      itemType
      name
      quantity
      unit
      spaceId
    }
  }
`;

const FIND_BY_CRITERIA_QUERY = `
  query InventoryItemsFindByCriteria($input: InventoryItemCriteriaInput) {
    inventoryItemsFindByCriteria(input: $input) {
      items {
        id
        name
        quantity
      }
      total
      page
    }
  }
`;

interface AuthSeed {
  token: string;
  spaceId: string;
}

async function seedAuth(
  ctx: E2EContext,
  email: string,
  password: string,
): Promise<AuthSeed> {
  const regRes = await gql(ctx.app, REGISTER_MUTATION, {
    input: { email, password },
  });
  const spaceId = regRes.body.data.register as string;

  const loginRes = await gql(ctx.app, LOGIN_MUTATION, {
    input: { email, password },
  });
  const token = loginRes.body.data.login.accessToken as string;

  return { token, spaceId };
}

const VALID_INPUT = {
  itemType: 'SEEDS',
  name: 'Lettuce seeds',
  quantity: 5,
  unit: 'PACKETS',
};

describe('Inventory GraphQL API (e2e)', () => {
  let ctx: E2EContext;
  let userA: AuthSeed;
  let userB: AuthSeed;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    userA = await seedAuth(ctx, EMAIL_A, PASSWORD);
    userB = await seedAuth(ctx, EMAIL_B, PASSWORD);
  });

  describe('mutation inventoryItemCreate', () => {
    it('creates an item and returns success with id', async () => {
      const res = await gql(
        ctx.app,
        CREATE_MUTATION,
        { input: VALID_INPUT },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.inventoryItemCreate.success).toBe(true);
      expect(typeof res.body.data.inventoryItemCreate.id).toBe('string');
    });

    it('returns error when unauthenticated', async () => {
      const res = await gql(ctx.app, CREATE_MUTATION, {
        input: VALID_INPUT,
      }).expect(200);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('query inventoryItemFindById', () => {
    it('returns the item when found in the space', async () => {
      const createRes = await gql(
        ctx.app,
        CREATE_MUTATION,
        { input: VALID_INPUT },
        userA.token,
        userA.spaceId,
      );
      const id = createRes.body.data.inventoryItemCreate.id as string;

      const res = await gql(
        ctx.app,
        FIND_BY_ID_QUERY,
        { input: { id } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.inventoryItemFindById).toMatchObject({
        id,
        name: 'Lettuce seeds',
        unit: 'PACKETS',
        spaceId: userA.spaceId,
      });
    });

    it('returns error when item belongs to a different space', async () => {
      const createRes = await gql(
        ctx.app,
        CREATE_MUTATION,
        { input: VALID_INPUT },
        userA.token,
        userA.spaceId,
      );
      const id = createRes.body.data.inventoryItemCreate.id as string;

      const res = await gql(
        ctx.app,
        FIND_BY_ID_QUERY,
        { input: { id } },
        userB.token,
        userB.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('query inventoryItemsFindByCriteria', () => {
    it('returns all items in the space', async () => {
      await gql(
        ctx.app,
        CREATE_MUTATION,
        { input: VALID_INPUT },
        userA.token,
        userA.spaceId,
      );
      await gql(
        ctx.app,
        CREATE_MUTATION,
        {
          input: {
            itemType: 'FERTILIZER',
            name: 'Tomato fertilizer',
            quantity: 2,
            unit: 'L',
          },
        },
        userA.token,
        userA.spaceId,
      );

      const res = await gql(
        ctx.app,
        FIND_BY_CRITERIA_QUERY,
        { input: {} },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.inventoryItemsFindByCriteria.items).toHaveLength(2);
      expect(res.body.data.inventoryItemsFindByCriteria.total).toBe(2);
    });
  });

  describe('mutation inventoryItemAdjustQuantity', () => {
    it('adjusts the quantity and returns success', async () => {
      const createRes = await gql(
        ctx.app,
        CREATE_MUTATION,
        { input: { ...VALID_INPUT, quantity: 10 } },
        userA.token,
        userA.spaceId,
      );
      const id = createRes.body.data.inventoryItemCreate.id as string;

      const res = await gql(
        ctx.app,
        ADJUST_MUTATION,
        { input: { id, delta: -4, reason: 'sowed' } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.inventoryItemAdjustQuantity.success).toBe(true);
    });
  });

  describe('mutation inventoryItemUpdate', () => {
    it('updates an item and returns success', async () => {
      const createRes = await gql(
        ctx.app,
        CREATE_MUTATION,
        { input: VALID_INPUT },
        userA.token,
        userA.spaceId,
      );
      const id = createRes.body.data.inventoryItemCreate.id as string;

      const res = await gql(
        ctx.app,
        UPDATE_MUTATION,
        { input: { id, name: 'Tomato seeds' } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.inventoryItemUpdate.success).toBe(true);
    });
  });

  describe('mutation inventoryItemDelete', () => {
    it('deletes an item and returns success', async () => {
      const createRes = await gql(
        ctx.app,
        CREATE_MUTATION,
        { input: VALID_INPUT },
        userA.token,
        userA.spaceId,
      );
      const id = createRes.body.data.inventoryItemCreate.id as string;

      const res = await gql(
        ctx.app,
        DELETE_MUTATION,
        { id },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.inventoryItemDelete.success).toBe(true);
    });

    it('returns error when item is not found', async () => {
      const res = await gql(
        ctx.app,
        DELETE_MUTATION,
        { id: 'f47ac10b-58cc-4372-a567-000000000099' },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('mutation inventoryItemsDeleteBulk', () => {
    it('deletes all ids and reports counts', async () => {
      const idA = (
        await gql(
          ctx.app,
          CREATE_MUTATION,
          { input: VALID_INPUT },
          userA.token,
          userA.spaceId,
        )
      ).body.data.inventoryItemCreate.id as string;

      const idB = (
        await gql(
          ctx.app,
          CREATE_MUTATION,
          { input: { ...VALID_INPUT, name: 'Tomato seeds' } },
          userA.token,
          userA.spaceId,
        )
      ).body.data.inventoryItemCreate.id as string;

      const res = await gql(
        ctx.app,
        DELETE_BULK_MUTATION,
        { input: { ids: [idA, idB] } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.inventoryItemsDeleteBulk).toMatchObject({
        deletedCount: 2,
        requestedCount: 2,
        notFoundIds: [],
      });
      expect(
        [...res.body.data.inventoryItemsDeleteBulk.deletedIds].sort(),
      ).toEqual([idA, idB].sort());
    });

    it('reports a cross-tenant id as not found without deleting it', async () => {
      const idA = (
        await gql(
          ctx.app,
          CREATE_MUTATION,
          { input: VALID_INPUT },
          userA.token,
          userA.spaceId,
        )
      ).body.data.inventoryItemCreate.id as string;

      const res = await gql(
        ctx.app,
        DELETE_BULK_MUTATION,
        { input: { ids: [idA] } },
        userB.token,
        userB.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.inventoryItemsDeleteBulk).toMatchObject({
        deletedIds: [],
        notFoundIds: [idA],
        deletedCount: 0,
      });

      const findRes = await gql(
        ctx.app,
        FIND_BY_ID_QUERY,
        { input: { id: idA } },
        userA.token,
        userA.spaceId,
      ).expect(200);
      expect(findRes.body.data.inventoryItemFindById).toMatchObject({
        id: idA,
      });
    });

    it('rejects a batch over 100 ids', async () => {
      const ids = Array.from(
        { length: 101 },
        () => 'f47ac10b-58cc-4372-a567-000000000099',
      );

      const res = await gql(
        ctx.app,
        DELETE_BULK_MUTATION,
        { input: { ids } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
    });
  });
});
