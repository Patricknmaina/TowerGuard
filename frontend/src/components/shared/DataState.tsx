interface DataStateProps {
  state: "loading" | "error" | "empty" | "success";
  message?: string;
}

const DataState = ({ state, message }: DataStateProps) => {
  if (state === "loading") {
    return <p className="text-sm text-charcoal-500">Loading data…</p>;
  }
  if (state === "error") {
    return <p className="text-sm text-rose-600">{message ?? "Something went wrong."}</p>;
  }
  if (state === "empty") {
    return <p className="text-sm text-charcoal-500">No records yet.</p>;
  }
  return null;
};

export default DataState;
