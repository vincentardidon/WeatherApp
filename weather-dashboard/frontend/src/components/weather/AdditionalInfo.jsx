import { Cloud, Database, Droplet, Info, Umbrella, Wind } from "lucide-react";
import Card from "../ui/Card.jsx";
import {
  NO_VALUE,
  formatPercent,
  formatPrecipitation,
  formatTemp,
  formatWindSpeed,
} from "../../utils/format.js";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="info-row">
      <dt className="info-label">
        <Icon size={16} aria-hidden="true" />
        {label}
      </dt>
      <dd className="info-value">{value}</dd>
    </div>
  );
}

function AdditionalInfo({ additional, meta, units }) {
  return (
    <Card id="more" title="Additional information" icon={Info} className="area-extra">
      <dl className="info-list">
        <InfoRow icon={Droplet} label="Dew point" value={formatTemp(additional.dewPoint, units)} />
        <InfoRow icon={Cloud} label="Cloud cover" value={formatPercent(additional.cloudCover)} />
        <InfoRow
          icon={Umbrella}
          label="Precipitation"
          value={formatPrecipitation(additional.precipitation, units)}
        />
        <InfoRow
          icon={Wind}
          label="Wind gusts"
          value={formatWindSpeed(additional.windGusts, units)}
        />
        <InfoRow icon={Database} label="Data source" value={meta.source ?? NO_VALUE} />
      </dl>
    </Card>
  );
}

export default AdditionalInfo;