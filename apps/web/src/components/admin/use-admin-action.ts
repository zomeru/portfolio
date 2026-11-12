import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useActionState } from "react";

function useAdminStateAction<State>(serverAction: (options: { data: FormData }) => Promise<State>) {
  const action = useServerFn(serverAction);
  const router = useRouter();
  return async (data: FormData) => {
    const result = await action({ data });
    await router.invalidate();
    return result;
  };
}

export function useAdminActionState<State>(
  serverAction: (options: { data: FormData }) => Promise<State>,
  initialState: Awaited<State>,
) {
  const action = useAdminStateAction(serverAction);
  return useActionState((_state: Awaited<State>, data: FormData) => action(data), initialState);
}

export function useAdminFormAction(
  serverAction: (options: { data: FormData }) => Promise<unknown>,
) {
  const action = useAdminStateAction(serverAction);
  return async (data: FormData) => {
    await action(data);
  };
}
