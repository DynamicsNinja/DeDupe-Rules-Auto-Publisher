using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;

namespace DeDupeRulesAutoPublisher.Plugins {
    public class RePublishDeDupeRules : IPlugin {
        public void Execute(IServiceProvider serviceProvider) {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory factory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = factory.CreateOrganizationService(context.UserId);
            ITracingService tracing = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            if(context.MessageName == "PublishAll") {
                PublishRules(service, tracing);
            }
        }

        private void PublishRules(IOrganizationService service, ITracingService tracing) {
            try {
                var rules = GetDuplicateRules(service, tracing);

                tracing.Trace("Fetched " + rules.Count + " duplicate rules that meet all conditions.");

                if(rules.Count >= 1) {
                    ExecuteMultipleRequest request = new ExecuteMultipleRequest() {
                        Settings = new ExecuteMultipleSettings() {
                            ContinueOnError = false,
                            ReturnResponses = false
                        },
                        Requests = new OrganizationRequestCollection()
                    };

                    foreach(Entity rule in rules) {
                        PublishDuplicateRuleRequest publishReq = new PublishDuplicateRuleRequest { DuplicateRuleId = rule.Id };
                        request.Requests.Add(publishReq);
                    }

                    service.Execute(request);
                } else {
                    tracing.Trace("Plugin execution cancelled, as there are no duplicate detection rules to publish.");
                }
            } catch(Exception ex) {
                tracing.Trace(ex.Message + Environment.NewLine + ex.StackTrace);
            }
        }

        private List<Entity> GetDuplicateRules(IOrganizationService service, ITracingService tracing) {
            var republishRules = GetDuplicateRulesForRepublish(service);
            var filter = "";
            var values = "";
            if(republishRules.Count >= 1) {
                tracing.Trace($"Found {republishRules.Count} that need to be republished.");
                filter = @" <condition attribute='duplicateruleid' operator='in' >VALUES</condition>";
                foreach(var republishRule in republishRules) {
                    values += $" <value>{republishRule}</value>";
                }
                filter = filter.Replace("VALUES", values);
            }
            var deDupeRuleFetch = @"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' >
                                        <entity name='duplicaterule' >
                                            <all-attributes/>
                                            <filter type='and' >
                                                <condition attribute='statecode' operator='eq' value='0' />"
                                                + filter +
                                          @"</filter>
                                        </entity>
                                    </fetch>";
            var deDupeRules = service.RetrieveMultiple(new FetchExpression(deDupeRuleFetch)).Entities.ToList();
            return deDupeRules;
        }

        private List<string> GetDuplicateRulesForRepublish(IOrganizationService service) {
            var republishRulesFetch = @"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
                                          <entity name='fic_dedupeconfiguration'>
                                            <attribute name='fic_dedupeconfigurationid' />
                                            <attribute name='fic_jobids' />
                                          </entity>
                                        </fetch>";
            var config = service.RetrieveMultiple(new FetchExpression(republishRulesFetch)).Entities.FirstOrDefault();
            if(config != null && config.Contains("fic_jobids")) {
                return ((string)config["fic_jobids"]).Split(',').ToList();
            }
            return null;
        }
    }
}