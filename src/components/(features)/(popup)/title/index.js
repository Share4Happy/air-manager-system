export default function Title({ content, click }) {
    return (
        <div className='flex justify-between items-center px-4 py-3 border-b border-[var(--border-color)] min-w-0 bg-[var(--bg-primary)]'>
            <h4 className='font-semibold text-base sm:text-lg text-[var(--text-primary)] truncate flex-1 mr-2'>{content}</h4>
            <button className='bg-transparent border-none text-2xl cursor-pointer text-[var(--text-primary)] shrink-0 leading-none hover:opacity-70 transition-opacity' onClick={click}>&times;</button>
        </div>
    )
}