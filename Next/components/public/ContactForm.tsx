'use client'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Namn krävs" })
    .max(100, { message: "Namnet får max vara 100 tecken" }),
  email: z
    .string()
    .trim()
    .email({ message: "Ogiltig e-postadress" })
    .max(255, { message: "E-postadressen får max vara 255 tecken" }),
  message: z
    .string()
    .trim()
    .min(1, { message: "Meddelande krävs" })
    .max(2000, { message: "Meddelandet får max vara 2000 tecken" }),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: data.name,
        email: data.email,
        message: data.message,
      });

      if (error) throw error;

      toast({
        title: "Tack för ditt meddelande!",
        description: "Vi återkommer så snart vi kan.",
      });

      form.reset();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Något gick fel",
        description: "Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Namn</FormLabel>
              <FormControl>
                <Input placeholder="Ditt namn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-post</FormLabel>
              <FormControl>
                <Input type="email" placeholder="din@epost.se" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meddelande</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Skriv ditt meddelande här..."
                  className="min-h-[120px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            "Skickar..."
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Skicka meddelande
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

