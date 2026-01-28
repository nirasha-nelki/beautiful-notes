import { supabase } from "@/lib/supabase-server";
import { NextResponse } from "next/dist/server/web/spec-extension/response";

export async function GET() {

    try {
        const {data: templates, error} = await supabase
            .from('template')
            .select('*')
            .order('id', {ascending: true})

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        };

        const formatted = templates.map(template => ({
            id: template.id,
            name: template.name,
            bgClass: template.bg_class,
            lineStyle: template.line_style,
            accentColor: template.accent_color,
            preview: template.preview,
            // isCustom: template.is_custom,
            // customImageUrl: template.custom_image_url || undefined,
        }));

        return NextResponse.json({templates: formatted});   
    } catch (err) {
    console.error(err);
    return NextResponse.json(
        {error: 'Failed to load templatessss'},
        {status: 500}
    );
}
}
