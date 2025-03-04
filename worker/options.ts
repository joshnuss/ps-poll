import type { Option } from '../shared/types.ts'

export const question = "What is your favorite fruit?"
export const options = new Map<string, Option>()

function addOption(option: Option) {
  options.set(option.key, option)
}

addOption({
  key: "apple",
  description: "Apple",
  color: 'red-2'
})
addOption({
  key: "pear",
  description: "Pear",
  color: 'green-2'
})
addOption({
  key: "pineapple",
  description: "Pineapple",
  color: 'yellow-5'
})
addOption({
  key: "kiwi",
  description: "Kiwi",
  color: 'green-4'
})

