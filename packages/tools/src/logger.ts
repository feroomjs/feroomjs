let i = 1

export const logger = {
    clear: () => i = 1,
    title: (text: string) => console.log(`\n${__DYE_WHITE__}=== ${text} ===${__DYE_RESET__}\n`),
    step: (text: string) => console.log(`${__DYE_BLUE__}${i++}. ${text}${__DYE_RESET__}\n`),
    info: (text: string) => console.log(`${__DYE_GREEN__}${text}${__DYE_RESET__}`),
    warn: (text: string) => console.log(`${__DYE_YELLOW__}${text}${__DYE_RESET__}`),
    error: (text: string) => console.log(`${__DYE_RED__}${text}${__DYE_RESET__}`),
    dev: (text: string) => console.log(`\n${__DYE_BLUE__} ▷  ${__DYE_BOLD__ + __DYE_YELLOW__}${text}${__DYE_RESET__}\n`),
}
