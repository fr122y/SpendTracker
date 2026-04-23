export interface HeaderBrandProps {
  title: string
}

export function HeaderBrand({ title }: HeaderBrandProps) {
  return (
    <h1 className="font-mono text-lg font-bold text-emerald-400 sm:text-xl">
      {title}
    </h1>
  )
}
