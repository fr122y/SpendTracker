export interface HeaderBrandProps {
  title: string
}

export function HeaderBrand({ title }: HeaderBrandProps) {
  return (
    <h1
      className="truncate font-mono text-lg font-bold text-emerald-400 sm:text-xl"
      title={title}
    >
      {title}
    </h1>
  )
}
