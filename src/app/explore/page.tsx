// C11: /explore redirect → /discover (탐색 페이지)
import { redirect } from "next/navigation";

export default function ExplorePage() {
  redirect("/discover");
}
