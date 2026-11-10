import {JsonToolsList} from "@/lib/registry/jsonToolsList";
import {CssToolsList} from "@/lib/registry/cssToolsList";
import {HtmlToolsList} from "@/lib/registry/htmlToolsList";
import {GraphqlToolsList} from "@/lib/registry/graphqlToolsList";
import {JsonldToolsList} from "@/lib/registry/jsonldToolsList";
import {JsonschemaToolsList} from "@/lib/registry/jsonschemaToolsList";
import {TypescriptToolsList} from "@/lib/registry/typescriptToolsList";
import {SvgToolsList} from "@/lib/registry/svgToolsList";
import {OtherToolsList} from "@/lib/registry/otherToolsList";
import {EncodersToolsList} from "@/lib/registry/encoders";
import {FlowToolsList} from "@/lib/registry/flowToolsList";
import {JavascriptToolsList} from "@/lib/registry/JavascriptToolsList";
import {ToolMeta} from "@/types/types";
import {DateTimeToolsList} from "@/lib/registry/dateTimeToolsList";
import {GeneratorToolsList} from "@/lib/registry/GeneratorToolsList";
import {DeveloperToolsList} from "@/lib/registry/developerToolsList";

export const AllToolsList: Record<string, ToolMeta> = {
    ...JsonToolsList,
    ...JavascriptToolsList,
    ...CssToolsList,
    ...HtmlToolsList,
    ...GraphqlToolsList,
    ...JsonldToolsList,
    ...JsonschemaToolsList,
    ...TypescriptToolsList,
    ...SvgToolsList,
    ...OtherToolsList,
    ...EncodersToolsList,
    ...FlowToolsList,
    ...DateTimeToolsList,
    ...GeneratorToolsList,
    ...DeveloperToolsList
};
