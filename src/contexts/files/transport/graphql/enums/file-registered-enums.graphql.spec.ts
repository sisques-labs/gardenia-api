describe('file-registered-enums.graphql', () => {
  it('should register FileMimeTypeEnum with GraphQL without throwing', async () => {
    await expect(
      import('./file-registered-enums.graphql'),
    ).resolves.toBeDefined();
  });
});
