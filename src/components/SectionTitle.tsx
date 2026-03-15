type Props = {
  children: React.ReactNode;
};

export default function SectionTitle({ children }: Props) {
  return (
    <h2 className="mb-6 border-l-4 border-green-600 pl-3 text-xl font-bold text-gray-900">
      {children}
    </h2>
  );
}
