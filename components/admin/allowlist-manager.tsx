"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

type Entry = {
  email: string;
  role: "admin" | "member";
  createdAt: string;
  createdBy: string;
};

const schema = z.object({
  email: z.email(),
  role: z.enum(["admin", "member"]),
});

export function AllowlistManager({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  async function refresh() {
    const response = await fetch("/api/allowlist");
    const payload = (await response.json()) as { entries: Entry[] };
    setEntries(payload.entries);
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true);
    try {
      const response = await fetch("/api/allowlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("allowlist 저장 실패");
      }

      await refresh();
      form.reset({ email: "", role: values.role });
      toast.success("allowlist가 저장되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(email: string) {
    setLoading(true);
    try {
      const response = await fetch("/api/allowlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("삭제 실패");
      }

      await refresh();
      toast.success(`${email} 삭제 완료`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "삭제 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>허용 이메일 추가</CardTitle>
          <CardDescription>Google 로그인 후 사용할 이메일을 Turso allowlist에 저장합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>권한</FormLabel>
                    <Select defaultValue={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">member</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button disabled={loading} type="submit">
                저장
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>현재 allowlist</CardTitle>
          <CardDescription>관리자와 일반 허용 사용자 목록을 바로 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이메일</TableHead>
                <TableHead>권한</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead>등록자</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.email}>
                  <TableCell className="font-medium">{entry.email}</TableCell>
                  <TableCell>
                    <Badge variant={entry.role === "admin" ? "default" : "secondary"}>{entry.role}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(entry.createdAt)}</TableCell>
                  <TableCell>{entry.createdBy}</TableCell>
                  <TableCell className="text-right">
                    <Button disabled={loading} variant="ghost" onClick={() => remove(entry.email)}>
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

