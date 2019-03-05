module.exports = {
  WB_NEI_URL: "https://nei.netease.com/3api/rpcs?pid=37501&platformId=10002&sign=665ccb4f3a21cdca5f114df5229eb3e416e07982dd13cd34e2bf9aefdf744fe0",
  WB_NEI_DETAIL_URL: ({ id }) => `https://nei.netease.com/3api/rpcs/${id}?platformId=10002&sign=26d20c2eefe95c71b555c8e8b267ebc251f251a84a7ab195d5b80fae9101f83c`,
  
  question_facade: {
    type: 'autocomplete',
    name: 'facadeName',
    message: 'What facade to list?',
    limit: 5,
    suggest(input, choices) {
      return choices.filter(choice => choice.message.includes(input));
    },
    choices: []
  },
  question_apiSelect: {
    type: 'MultiSelect',
    name: 'apiList',
    message: 'Click blank space to pick your working Api, null mains All',
    choices: []
  }
}